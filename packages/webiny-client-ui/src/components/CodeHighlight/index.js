import React from "react";
import { createComponent } from "webiny-client";
import "./styles.scss?extract";

class CodeHighlight extends React.Component {
    componentDidMount() {
        this.doHighlight();
    }

    componentDidUpdate() {
        this.doHighlight();
    }

    doHighlight() {
        this.props.modules.hljs.highlightBlock(this.dom);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return (
            <pre>
                <code ref={ref => (this.dom = ref)} className={this.props.language}>
                    {this.props.children}
                </code>
            </pre>
        );
    }
}

CodeHighlight.defaultProps = {
    language: "html"
};

export default createComponent(CodeHighlight, { modules: { hljs: "Vendor.Highlight" } });